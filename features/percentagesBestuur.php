<?php

class percentagesBestuur
{

    function render( &$data, $ref, $category='', $target_question='', $show_legend = FALSE, $example = FALSE)
    {
        require_once("./pChart/class/pData.class.php");
        require_once("./pChart/class/pDraw.class.php");
        require_once("./pChart/class/pImage.class.php");
        require_once("./features/utils.php");
        $temp           = 'temp/';
        $datastring     = $data['all.questions.bestuur'];
        $schoolname     = $data['schoolnaam'];
        //konqord JSON is false becuse escape character on '
        $datastring     = str_replace('\\\'', '\'', $datastring);
        $all_questions  = json_decode($datastring);
        //add graphic to docx
        $percentage_docx = new CreateDocx();
        
        $paramsTextHeader = array(
            'color' => '000000',
            'font' => 'Century Gothic',
            'border_color'=>'FFFFFF',
            'sz' => 9.5,
            'jc' => 'center'
        );        

        $paramsTextTable = array(
            'color' => '000000',
            'font' => 'Century Gothic',
            'border_color'=>'000000',
            'sz' => 9.5,
            'jc' => 'center',
            'border' => 'single'
        );        

        $paramsTextRefs = array(
            'color' => '000000',
            'font' => 'Century Gothic',
            'border_color'=>'000000',
            'sz' => 9.5,
            'jc' => 'left'
        );        

        $widthTableCols = array(
            2800,
        );

        //create array iso object
        $all_questions_array = array();
        foreach($all_questions as $question_number=>$question){
            $all_questions_array[intval($question_number)] = $question;
        };
        
        ksort($all_questions_array);
        $first = TRUE;
        $question_count = 0;
        $percentage_table = Array(Array(' '));
        $targeted = FALSE;
        foreach($all_questions_array as $question_number=>$question){
            if (($category != '') and ($category != $question->{'group_name'})){
                continue;
            } 
            if (($target_question != '') and ($target_question != $question_number)){
                continue;
            } 
            if (!isset($question->{'statistics'}->{'percentage'})){
                continue;
            }
            if (count($question->{'statistics'}->{'percentage'}) == 0){
                continue;
            }
            $valid_question_types = array('TEVREDEN','PTP_TEVREDEN');
            if (!in_array($question->{'question_type'}[0][1], $valid_question_types)){
                continue;
            }
            $question_count++;
            $answer_count_peiling = 0;
            $answer_count_alle_scholen = 0;
            $text = array();
            
            $paramsTitle = array(
                'val' => 2,
                'sz' => 10,
                'font' => 'Century Gothic'
            );

            if (($target_question == '') and ($first or ($question->{'group_name'} != $old_group_name))){
                if (!$first){
                    //create pagebreak
                    $percentage_docx->addBreak('page');
                }
                if ($target_question != '') {
                    //create group heading
                    $percentage_docx->addTitle($question->{'group_name'},$paramsTitle);
                    $question_count = 0;
                }
                
                $first = false;
                $old_group_name = $question->{'group_name'};
            }            
            
            $text[] =
                array(
                    'text' => $question_number.". ".filter_text($question->{'description'}),
                    'b' => 'single',
                    'sz' => 10,
                    'font' => 'Century Gothic'
            );



            $percentage_table[0][$question_count] = filter_text($question->{'short_description'});

//            var_dump($question->{'statistics'}->{'distribution'});
            $ref_count = 1;
            $widthTableCols[$question_count] = 1000;
            foreach ($question->{'refs'} as $reference){
//                var_dump($question->{'statistics'}->{'distribution'}->{$reference});
                $peiling_distribution      = $question->{'statistics'}->{'distribution'}->{$reference};
                $answer_peiling            = array();
                foreach ($peiling_distribution as $answer) {
                    $answer_count_peiling += $answer[2];
                    $answer_peiling[$answer[0]] = $answer;
                }
                //add references to first column
                $percentage_table[$ref_count][0] = filter_text($reference);
//                var_dump($answer_peiling[4]);
                $satisfied = (isset($answer_peiling[4][2]) ? $answer_peiling[4][2] : 0) + (isset($answer_peiling[3][2]) ? $answer_peiling[3][2] : 0);
                $unsatisfied = (isset($answer_peiling[1][2]) ? $answer_peiling[1][2] : 0) + (isset($answer_peiling[2][2]) ? $answer_peiling[2][2] : 0);
                if ($satisfied + $unsatisfied > 0){
                    $satisfied_percentage = round($satisfied / ($satisfied + $unsatisfied) * 100);
                    $unsatisfied_percentage = round($unsatisfied / ($satisfied + $unsatisfied) * 100);
                } else {
//                    continue;
                }
                if ($satisfied_percentage < 75){
                    $paramsTextTable['cell_color'] = 'FF5050';
                } elseif ($satisfied_percentage < 85) {
                    $paramsTextTable['cell_color'] = 'FFCC66';
                } elseif ($satisfied_percentage < 95) {
                    $paramsTextTable['cell_color'] = 'CCFF99';
                } else {
                    $paramsTextTable['cell_color'] = '99CC00';
                }
                $text = $satisfied_percentage . ' / ' . $unsatisfied_percentage;
                $paramsTextTable['text'] = $text;
                $text_table = $percentage_docx->addElement('addText', array($paramsTextTable));
                $percentage_table[$ref_count][$question_count] = $text_table;
                $ref_count++;
            }
            
 
           
                        
        }

        //draw table
        $paramsTable = array(
            'border' => 'none',
            'border_sz' => 20,
            'border_spacing' => 0,
            'border_color' => '000000',
            'jc' => 'left',
            'size_col' => $widthTableCols,
        );
//        var_dump($percentage_table);
        $percentage_docx->addTable($percentage_table, $paramsTable);
        
            
        if ($question_count > 0){
//            $filename = encodeForURL($temp.'percentage'.$category.$target_question);
            $filename = $temp.sanitize_filename('percentageBestuur'.$category.$target_question.randchars(12));
            $percentage_docx->createDocx($filename);
            unset($percentage_docx);
            return $filename.'.docx';
        } else {
            unset($percentage_docx);
            return null;
        }

        
    }
    
    private function _draw_graphic($question_number, $graphic_data_peiling, $graphic_data_alle_scholen, $graphic_answer, $graphic_answered, $graphic_percentage, $graphic_percentage_total, $show_legend, $schoolname, $temp)
    {
        /* Create and populate the pData object */
        $MyData = new pData();
        $MyData->loadPalette("./pChart/palettes/sms.color", TRUE);
        $MyData->addPoints($graphic_data_peiling, "Percentage ". $schoolname);
        if (count($graphic_data_alle_scholen)>0){
            $MyData->addPoints($graphic_data_alle_scholen, "Percentage alle scholen");
        }
//        $MyData->setAxisName(0, "Percentages");
        $MyData->addPoints($graphic_answer, "Answers");
        $MyData->setSerieDescription("Answers", "Answers");
        $MyData->setAbscissa("Answers");
        //        $MyData -> setAbscissaName("Browsers");
//        $MyData->setAxisDisplay(0, AXIS_FORMAT_DEFAULT);
        $MyData->setAxisColor(0, array(
            "R" => 255,
            "G" => 255,
            "B" => 255,
            "Alpha" => 0
        ));
        
        /* Create the pChart object */
        $legend_height = ($show_legend) ? 50 : 0;
        $picture_height = 2 * ( (1 + count($graphic_answer)) * 15) + 18 + $legend_height;
        $myPicture = new pImage(1200, $picture_height, $MyData);
        $myPicture->setFontProperties(array(
            "FontName" => "./pChart/fonts/calibri.ttf",
            "FontSize" => 20,
            "R" => 255,
            "G" => 255,
            "B" => 255,
            "b" => "double"
        ));
        
        /* Draw the chart scale */
        $graphic_height = 2 * ( (1 + count($graphic_answer)) * 15 );
        $myPicture->setGraphArea(600, 18, 960, $graphic_height);
        $AxisBoundaries = array(
            0 => array(
                "Min" => 0,
                "Max" => 100
            )
        );
        $myPicture->drawScale(array(
            "ManualScale" => $AxisBoundaries,
            "DrawSubTicks" => FALSE,
            "GridR" => 0,
            "GridG" => 0,
            "GridB" => 0,
            "AxisR" => 80,
            "AxisG" => 80,
            "AxisB" => 80,
            "GridAlpha" => 10,
            "Pos" => SCALE_POS_TOPBOTTOM,
            "Mode" => SCALE_MODE_MANUAL
        ));
        //
        
            $Palette[] = array( 0=>array("R"=>0,"G"=>164,"B"=>228,"Alpha"=>100),
                                1=>array("R"=>247,"G"=>142,"B"=>30,"Alpha"=>100));

        /* Draw the chart */
        $myPicture->drawBarChart(array(
            "DisplayValues" => FALSE,
            "Rounded" => FALSE,
            "Surrounding" => 5,
            "DisplayR" => 255,
            "DisplayG" => 255,
            "DisplayB" => 255,
//            "OverrideColors"=>$Palette
                                    
        ));
        for ($i=0;$i<count($graphic_answer);$i++){
            $myPicture->drawText(320, 40 + ($i)*31,$graphic_answer[$i],array("R"=>0,"G"=>0,"B"=>0,'Align' => TEXT_ALIGN_MIDDLERIGHT, "DrawBox" => FALSE));
            $myPicture->drawText(400, 40 + ($i)*31,$graphic_answered[$i],array("R"=>0,"G"=>0,"B"=>0,'Align' => TEXT_ALIGN_MIDDLERIGHT, "DrawBox" => FALSE));
            $myPicture->drawText(490, 40 + ($i)*31,$graphic_percentage[$i]."%",array("R"=>0,"G"=>0,"B"=>0,'Align' => TEXT_ALIGN_MIDDLERIGHT, "DrawBox" => FALSE));
            if (isset($graphic_percentage_total[$i])){
                $myPicture->drawText(580, 40 + ($i)*31,"(".$graphic_percentage_total[$i]."%)",array("R"=>80,"G"=>80,"B"=>80,'Align' => TEXT_ALIGN_MIDDLERIGHT, "DrawBox" => FALSE));
            }
        }
        if ($show_legend){
            $myPicture->drawLegend(10,40 + ($i)*31,array("BoxWidth"=>20,"BoxHeight"=>20,"Style"=>LEGEND_NOBORDER ,"Mode"=>LEGEND_VERTICAL, "FontR" => 0, "FontG" => 0, "FontB" => 0));
        }
        
        $myPicture->render($temp . "percentages$question_number.png");
        // var_dump($all_questions);
        return $temp . "percentages$question_number.png";
        
    }



}
